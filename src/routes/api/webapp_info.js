import axios from 'axios';
import { getPreviewFromContent } from "link-preview-js";
import { promises as dns } from 'dns';

function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, c => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[c]));
}

function isPrivateIp(ip) {
    return (
        /^10\./.test(ip) ||
        /^127\./.test(ip) ||
        /^169\.254\./.test(ip) ||
        /^192\.168\./.test(ip) ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip) ||
        ip === '0.0.0.0' ||
        ip === '::1' ||
        ip.startsWith('fc') ||
        ip.startsWith('fd') ||
        ip.startsWith('fe80:')
    );
}

async function crawl(webapp_url){
    if(webapp_url == null){
        return null;
    }
    let webapp = {
        url: webapp_url,
        icon: '/images/xp/icons/ApplicationWindow.png',
        name: 'Untitled Program',
        desc: ''
    };
    try {
        let response = await axios.get(webapp_url, {
            timeout: 5000,
            maxContentLength: 1024 * 1024,
            maxBodyLength: 1024 * 1024
        });
        response.url = response.config.url;
        if(response.headers['x-frame-options'] != null){
            return null;
        }
        let data  = await getPreviewFromContent(response);
        if(!is_empty(data.siteName)){
            webapp.name = data.siteName;
        } else if(!is_empty(data.title)){
            webapp.name = data.title;
        }
        if(data.favicons != null && data.favicons.length >= 1){
            webapp.icon = data.favicons[data.favicons.length - 1];
        }
        webapp.desc = data.description || '';
    } catch (error) {
        return null;
    }
    return webapp;
}

function is_empty(str){
    return str == null || str.trim() == '';
}

export async function GET({request}){
    let webapp_url = request.headers.get('webapp_url');
    let url;
    try {
        url = new URL(webapp_url);
    } catch {
        return { status: 400, body: { error: 'Invalid URL' } };
    }
    if(url.protocol !== 'http:' && url.protocol !== 'https:'){
        return { status: 400, body: { error: 'Invalid URL' } };
    }
    try {
        let addresses = await dns.lookup(url.hostname, { all: true });
        if(addresses.some(addr => isPrivateIp(addr.address))){
            return { status: 400, body: { error: 'Disallowed URL' } };
        }
    } catch {
        return { status: 400, body: { error: 'Invalid URL' } };
    }

    let webapp = await crawl(url.href);
    if(webapp == null){
        return { status: 400, body: { error: 'Unable to fetch webapp info' } };
    }
    webapp.name = sanitize(webapp.name);
    webapp.icon = sanitize(webapp.icon);
    webapp.desc = sanitize(webapp.desc);

    return {
        status: 200,
        body: { webapp }
    };
}