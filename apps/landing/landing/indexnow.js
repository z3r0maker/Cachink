/**
 * IndexNow (Bing, Yandex, Naver, Seznam): after a deploy, scripts/indexnow.mjs
 * tells the engines which pages changed instead of waiting for a crawl. The
 * key is public by design — the engines verify it by fetching
 * https://xangarro.mx/<key>.txt, which the prerender writes from this value.
 */
export const INDEXNOW_KEY = '823d7c59c94bd3a5aebdb76567d8530f';
