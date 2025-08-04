import { json } from "solid-start/api";
import isValidHttpUrl from "is-valid-http-url";
import { getLinkPreview } from "link-preview-js";
import dns from "node:dns/promises";
import net from "node:net";

const PRIVATE_IPV4 = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./
];

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    return PRIVATE_IPV4.some(r => r.test(ip));
  }
  if (net.isIPv6(ip)) {
    return ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80");
  }
  return true;
}

async function isPrivateHost(host) {
  if (net.isIP(host)) {
    return isPrivateIp(host);
  }
  try {
    const records = await dns.lookup(host, { all: true });
    return records.some(r => isPrivateIp(r.address));
  } catch {
    // If DNS fails, treat as private to be safe
    return true;
  }
}

function sanitize(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>?/gm, "").trim();
}

export async function GET({ request }) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target || !isValidHttpUrl(target)) {
    return json({ error: "invalid url" }, 400);
  }

  const parsed = new URL(target);
  if (await isPrivateHost(parsed.hostname)) {
    return json({ error: "blocked host" }, 400);
  }

  try {
    const data = await getLinkPreview(target, { timeout: 5000 });

    const name = sanitize(data.title || data.siteName || "");
    const description = sanitize(data.description || "");
    let icon = "";
    if (Array.isArray(data.favicons) && data.favicons[0] && isValidHttpUrl(data.favicons[0])) {
      icon = data.favicons[0];
    } else if (Array.isArray(data.images) && data.images[0] && isValidHttpUrl(data.images[0])) {
      icon = data.images[0];
    }

    return json({ name, icon, description });
  } catch (e) {
    const status = e.code === "ECONNABORTED" ? 504 : 500;
    return json({ error: "failed to fetch" }, status);
  }
}
