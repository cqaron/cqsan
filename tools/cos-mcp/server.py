"""COS publishing MCP server with a human approval gate.

Flow:
  1. cos_plan_publish   -> compares release/portfolio-site with the COS bucket and writes a plan (no remote writes).
  2. You review and approve in your own terminal:
         python tools/cos-mcp/server.py approve <plan_id>
     The approve command shows the file list and requires you to type YES.
  3. cos_apply_plan     -> uploads only an approved, unexpired plan. Assets go first, HTML last.

The MCP tools can never approve a plan. Credentials come from environment variables only:
  COS_SECRET_ID, COS_SECRET_KEY, COS_BUCKET (full name incl. APPID), COS_REGION (default ap-hongkong)
"""
from __future__ import annotations

import hashlib
import json
import mimetypes
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STATE = ROOT / ".cos-mcp"
PLANS = STATE / "plans"
DEFAULT_RELEASE = "release/publish-current"
RELEASE_ZIP = ROOT / "release" / "portfolio-site.zip"
APPROVAL_TTL = 2 * 3600  # seconds an approval stays valid
HASHED_NAME = re.compile(r"\.[0-9a-f]{10}\.[a-z0-9]+$")


def _cos_client():
    from qcloud_cos import CosConfig, CosS3Client

    secret_id = os.environ.get("COS_SECRET_ID", "")
    secret_key = os.environ.get("COS_SECRET_KEY", "")
    region = os.environ.get("COS_REGION", "ap-hongkong")
    if not secret_id or not secret_key:
        raise RuntimeError("缺少环境变量 COS_SECRET_ID / COS_SECRET_KEY")
    config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Scheme="https")
    return CosS3Client(config)


def _bucket() -> str:
    bucket = os.environ.get("COS_BUCKET", "")
    if not bucket:
        raise RuntimeError("缺少环境变量 COS_BUCKET（完整桶名，含 APPID）")
    return bucket


def _md5(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def _cache_control(key: str) -> str:
    if key.endswith(".html"):
        return "no-cache"
    if HASHED_NAME.search(key):
        return "public, max-age=31536000, immutable"
    return "public, max-age=300"


def _content_type(key: str) -> str:
    guessed, _ = mimetypes.guess_type(key)
    overrides = {".webp": "image/webp", ".woff2": "font/woff2", ".js": "application/javascript; charset=utf-8",
                 ".css": "text/css; charset=utf-8", ".html": "text/html; charset=utf-8"}
    return overrides.get(Path(key).suffix.lower(), guessed or "application/octet-stream")


def _local_files(release_dir: Path) -> dict[str, Path]:
    if not (release_dir / "index.html").exists():
        raise RuntimeError(f"{release_dir} 下没有 index.html，请先运行 python tools/package-release.py")
    files = {}
    for path in sorted(release_dir.rglob("*")):
        if path.is_file():
            files[path.relative_to(release_dir).as_posix()] = path
    return files


def _remote_index(client, bucket: str) -> dict[str, dict]:
    remote: dict[str, dict] = {}
    marker = ""
    while True:
        resp = client.list_objects(Bucket=bucket, Marker=marker, MaxKeys=1000)
        for item in resp.get("Contents", []) or []:
            remote[item["Key"]] = {"etag": item["ETag"].strip('"'), "size": int(item["Size"])}
        if resp.get("IsTruncated") == "true" and resp.get("NextMarker"):
            marker = resp["NextMarker"]
        else:
            break
    return remote


def _plan_path(plan_id: str) -> Path:
    if not re.fullmatch(r"[\w-]+", plan_id):
        raise RuntimeError("非法的 plan_id")
    return PLANS / f"{plan_id}.json"


def _load_plan(plan_id: str) -> dict:
    path = _plan_path(plan_id)
    if not path.exists():
        raise RuntimeError(f"找不到计划 {plan_id}")
    return json.loads(path.read_text(encoding="utf-8"))


def _save_plan(plan: dict) -> None:
    PLANS.mkdir(parents=True, exist_ok=True)
    _plan_path(plan["id"]).write_text(json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8")


def _cdn_client():
    from tencentcloud.cdn.v20180606 import cdn_client
    from tencentcloud.common import credential

    secret_id = os.environ.get("COS_SECRET_ID", "")
    secret_key = os.environ.get("COS_SECRET_KEY", "")
    if not secret_id or not secret_key:
        raise RuntimeError("缺少环境变量 COS_SECRET_ID / COS_SECRET_KEY")
    return cdn_client.CdnClient(credential.Credential(secret_id, secret_key), "")


def _cdn_base() -> str:
    base = os.environ.get("COS_CDN_BASE", "").rstrip("/")
    if not base.startswith("https://"):
        raise RuntimeError("请设置环境变量 COS_CDN_BASE，例如 https://www.cqsan.cn")
    return base


def plan_cdn_refresh(publish_id: str) -> dict:
    """Derive purge + prefetch URLs from an applied publish plan. Only non-hashed files need purging,
    because hashed asset names are new URLs on every release."""
    publish = _load_plan(publish_id)
    if publish["status"] != "applied":
        raise RuntimeError(f"发布计划 {publish_id} 状态为 {publish['status']}，需先成功上传")
    base = _cdn_base()
    purge = {f"{base}/{item['key']}" for item in publish["uploads"] if not HASHED_NAME.search(item["key"])}
    purge.add(f"{base}/")
    # Hash-routed site (app/src/main.tsx HashRouter): every page is served from "/", so only the root
    # needs warming. Subpaths like /about do not exist on the server and must not be prefetched.
    prefetch = [f"{base}/"]
    plan = {
        "id": "cdn-" + publish["id"],
        "type": "cdn",
        "status": "pending",
        "created": datetime.now(timezone.utc).isoformat(),
        "source_publish": publish["id"],
        "purge_urls": sorted(purge),
        "prefetch_urls": prefetch,
    }
    _save_plan(plan)
    return plan


def apply_cdn_plan(plan_id: str, client=None) -> dict:
    from tencentcloud.cdn.v20180606 import models

    plan = _load_plan(plan_id)
    if plan.get("type") != "cdn":
        raise RuntimeError("这不是 CDN 计划")
    if plan["status"] != "approved":
        raise RuntimeError(f"计划状态为 {plan['status']}，只有你确认后才能执行")
    if time.time() - plan["approved_at_epoch"] > APPROVAL_TTL:
        raise RuntimeError("批准已过期，请重新生成计划")
    client = client or _cdn_client()
    area = os.environ.get("CDN_AREA", "overseas")  # www.cqsan.cn 服务地域为中国境外
    purge_req = models.PurgeUrlsCacheRequest()
    purge_req.Urls = plan["purge_urls"]
    purge_req.Area = area
    purge = json.loads(client.PurgeUrlsCache(purge_req).to_json_string())
    # Prefetch after purge so the warmed copy is the new version.
    push_req = models.PushUrlsCacheRequest()
    push_req.Urls = plan["prefetch_urls"]
    push_req.Area = area
    prefetch = json.loads(client.PushUrlsCache(push_req).to_json_string())
    plan["status"] = "applied"
    plan["result"] = {"purge": purge, "prefetch": prefetch}
    _save_plan(plan)
    return plan["result"]


def _refresh_release_from_zip() -> Path:
    """Always publish from the latest build ZIP, never from an old unpacked folder."""
    import shutil
    import zipfile

    if not RELEASE_ZIP.exists():
        raise RuntimeError("没有找到 release/portfolio-site.zip，请先运行 python tools/package-release.py")
    target = ROOT / DEFAULT_RELEASE
    shutil.rmtree(target, ignore_errors=True)
    with zipfile.ZipFile(RELEASE_ZIP) as bundle:
        bundle.extractall(target)
    return target


def plan_publish(release_dir: str = DEFAULT_RELEASE, client=None, bucket: str | None = None) -> dict:
    if release_dir == DEFAULT_RELEASE:
        release = _refresh_release_from_zip()
    else:
        release = (ROOT / release_dir).resolve()
    local = _local_files(release)
    bucket = bucket or _bucket()
    client = client or _cos_client()
    remote = _remote_index(client, bucket)

    uploads, unchanged = [], 0
    for key, path in local.items():
        digest = _md5(path)
        remote_item = remote.get(key)
        # Multipart ETags contain "-" and are not plain MD5, so treat them as changed.
        if remote_item and remote_item["etag"] == digest and "-" not in remote_item["etag"]:
            unchanged += 1
        else:
            uploads.append({"key": key, "md5": digest, "size": path.stat().st_size,
                            "new": remote_item is None})
    # Assets first, HTML last, so pages never reference files that are not uploaded yet.
    uploads_ordered = sorted(uploads, key=lambda u: (u["key"].endswith(".html"), u["key"]))

    stale = sorted(k for k in remote if k not in local)
    plan_id = datetime.now().strftime("%Y%m%d-%H%M%S") + "-" + hashlib.sha1(
        json.dumps([u["key"] + u["md5"] for u in uploads_ordered]).encode()).hexdigest()[:6]
    plan = {
        "id": plan_id,
        "status": "pending",
        "created": datetime.now(timezone.utc).isoformat(),
        "bucket": bucket,
        "region": os.environ.get("COS_REGION", "ap-hongkong"),
        "release_dir": str(release.relative_to(ROOT).as_posix()),
        "uploads": uploads_ordered,
        "unchanged": unchanged,
        "stale_remote_not_deleted": stale,
    }
    _save_plan(plan)
    return plan


def summarize(plan: dict) -> str:
    if plan.get("type") == "cdn":
        lines = [f"CDN 计划 {plan['id']}（状态：{plan['status']}）",
                 f"刷新缓存 {len(plan['purge_urls'])} 个 URL：", *[f"  - {u}" for u in plan["purge_urls"][:60]],
                 f"预热 {len(plan['prefetch_urls'])} 个 URL：", *[f"  - {u}" for u in plan["prefetch_urls"]]]
        return "\n".join(lines)
    new = sum(1 for u in plan["uploads"] if u["new"])
    total_bytes = sum(u["size"] for u in plan["uploads"])
    lines = [
        f"计划 {plan['id']}（状态：{plan['status']}）",
        f"桶：{plan['bucket']}（{plan['region']}）",
        f"需上传 {len(plan['uploads'])} 个文件（新增 {new}，覆盖 {len(plan['uploads']) - new}），"
        f"约 {total_bytes / 1024 / 1024:.2f} MB；未变化 {plan['unchanged']} 个。",
        f"远端多余但不会删除 {len(plan['stale_remote_not_deleted'])} 个。",
    ]
    lines += [f"  - {u['key']}" for u in plan["uploads"][:60]]
    if len(plan["uploads"]) > 60:
        lines.append(f"  ...另有 {len(plan['uploads']) - 60} 个")
    return "\n".join(lines)


def apply_plan(plan_id: str, client=None) -> dict:
    plan = _load_plan(plan_id)
    if plan["status"] != "approved":
        raise RuntimeError(f"计划状态为 {plan['status']}，只有你在终端确认后才能上传")
    if time.time() - plan["approved_at_epoch"] > APPROVAL_TTL:
        raise RuntimeError("批准已过期，请重新生成计划")
    release = ROOT / plan["release_dir"]
    local = _local_files(release)
    # Refuse if the local files changed after the plan was made.
    for item in plan["uploads"]:
        path = local.get(item["key"])
        if path is None or _md5(path) != item["md5"]:
            raise RuntimeError(f"本地文件已变化：{item['key']}，请重新生成计划")

    client = client or _cos_client()
    done, failed = [], None
    plan["status"] = "applying"
    _save_plan(plan)
    for item in plan["uploads"]:
        path = local[item["key"]]
        try:
            with path.open("rb") as body:
                client.put_object(Bucket=plan["bucket"], Body=body, Key=item["key"], EnableMD5=True,
                                  CacheControl=_cache_control(item["key"]),
                                  ContentType=_content_type(item["key"]))
            done.append(item["key"])
        except Exception as error:  # stop at first failure; HTML is still pending, so the site stays consistent
            failed = {"key": item["key"], "error": str(error)}
            break
    plan["status"] = "applied" if failed is None else "failed"
    plan["uploaded"] = done
    plan["failed"] = failed
    _save_plan(plan)
    result = {"status": plan["status"], "uploaded_count": len(done), "failed": failed}
    # Bundled approval: only after a fully successful upload (HTML last, so the site is consistent)
    if plan["status"] == "applied" and plan.get("with_cdn"):
        cdn = plan_cdn_refresh(plan_id)
        cdn["status"] = "approved"
        cdn["approved_at_epoch"] = plan["approved_at_epoch"]  # the same approval, the same TTL
        _save_plan(cdn)
        result["cdn"] = apply_cdn_plan(cdn["id"])
    return result


def _approve_cli(plan_id: str, assume_yes: bool = False, with_cdn: bool = False) -> None:
    plan = _load_plan(plan_id)
    if plan["status"] != "pending":
        sys.exit(f"计划状态为 {plan['status']}，无法批准")
    print(summarize(plan))
    if assume_yes:
        # Used only after the user explicitly approves this exact plan id in chat.
        answer = "YES"
    else:
        answer = input("\n确认执行以上计划？输入 YES 继续：")
    if answer.strip() != "YES":
        plan["status"] = "rejected"
        _save_plan(plan)
        print("已取消。")
        return
    plan["status"] = "approved"
    plan["approved_at_epoch"] = time.time()
    # --with-cdn: one approval covers the upload AND the CDN refresh derived from it (see apply_plan)
    plan["with_cdn"] = with_cdn
    _save_plan(plan)
    if with_cdn:
        print("已批准（含 CDN）。请在 Cursor 中让 AI 执行 cos_apply_plan，上传成功后会自动刷新 CDN。")
    else:
        print("已批准。请在 Cursor 中让 AI 执行 cos_apply_plan。")


def _reject_cli(plan_id: str) -> None:
    plan = _load_plan(plan_id)
    plan["status"] = "rejected"
    _save_plan(plan)
    print("已拒绝。")


def build_server():
    from mcp.server.fastmcp import FastMCP

    mcp = FastMCP("cos-publisher")

    @mcp.tool()
    def cos_status() -> str:
        """Show COS configuration status (no secrets) and local release file count."""
        bucket = os.environ.get("COS_BUCKET", "(未设置)")
        ok_creds = bool(os.environ.get("COS_SECRET_ID") and os.environ.get("COS_SECRET_KEY"))
        region = os.environ.get("COS_REGION", "ap-hongkong")
        import zipfile

        if RELEASE_ZIP.exists():
            with zipfile.ZipFile(RELEASE_ZIP) as bundle:
                count = len([n for n in bundle.namelist() if not n.endswith("/")])
            zip_info = f"最新 ZIP（{RELEASE_ZIP.stat().st_size / 1024 / 1024:.2f} MB）包含文件数={count}"
        else:
            zip_info = "没有找到发布 ZIP，请先运行 python tools/package-release.py"
        return f"bucket={bucket}\nregion={region}\n密钥已设置={ok_creds}\n{zip_info}"

    @mcp.tool()
    def cos_list_remote(prefix: str = "", limit: int = 200) -> str:
        """List objects in the COS bucket (read-only)."""
        remote = _remote_index(_cos_client(), _bucket())
        keys = sorted(k for k in remote if k.startswith(prefix))
        head = f"共 {len(keys)} 个对象（显示前 {min(limit, len(keys))} 个）"
        return "\n".join([head] + keys[:limit])

    @mcp.tool()
    def cos_plan_publish(release_dir: str = DEFAULT_RELEASE) -> str:
        """Compare the local release folder with the bucket and create a plan. Does NOT upload anything.
        After this, the user must approve the plan in their own terminal before cos_apply_plan works."""
        plan = plan_publish(release_dir)
        return summarize(plan) + (
            f"\n\n请你在本机终端运行（路径按项目实际）：\n"
            f"python tools/cos-mcp/server.py approve {plan['id']}\n"
            f"确认无误后输入 YES。之后再调用 cos_apply_plan。"
        )

    @mcp.tool()
    def cos_apply_plan(plan_id: str) -> str:
        """Upload an approved plan to COS. Refuses unless the user approved it in the terminal."""
        result = apply_plan(plan_id)
        return json.dumps(result, ensure_ascii=False, indent=2)

    @mcp.tool()
    def cdn_plan_refresh(publish_id: str) -> str:
        """After a successful upload, create a CDN plan: purge changed non-hashed URLs and prefetch the home
        and main subpages. Does NOT call CDN. Needs user approval first."""
        plan = plan_cdn_refresh(publish_id)
        return summarize(plan) + (
            f"\n\n请你确认后在终端运行：python tools/cos-mcp/server.py approve {plan['id']}\n"
            f"之后再调用 cdn_apply_refresh。")

    @mcp.tool()
    def cdn_apply_refresh(plan_id: str) -> str:
        """Purge and prefetch CDN URLs for an approved CDN plan."""
        return json.dumps(apply_cdn_plan(plan_id), ensure_ascii=False, indent=2)

    return mcp


def main(argv: list[str]) -> None:
    if len(argv) >= 3 and argv[1] == "approve":
        _approve_cli(argv[2], assume_yes="--yes" in argv[3:], with_cdn="--with-cdn" in argv[3:])
    elif len(argv) >= 2 and argv[1] == "reject" and len(argv) == 3:
        _reject_cli(argv[2])
    elif len(argv) >= 2 and argv[1] == "list":
        for path in sorted(PLANS.glob("*.json")) if PLANS.exists() else []:
            plan = json.loads(path.read_text(encoding="utf-8"))
            print(f"{plan['id']}  {plan['status']}  {len(plan['uploads'])} 个文件")
    else:
        build_server().run()


if __name__ == "__main__":
    main(sys.argv)
