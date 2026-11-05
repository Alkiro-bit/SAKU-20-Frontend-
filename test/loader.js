export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@/services/api' || specifier === '@/services/api.js') {
    return nextResolve(new URL('./mocks/api.js', import.meta.url).href, context);
  }
  if (specifier.startsWith('@/')) {
    const resolved = new URL(`../src/${specifier.slice(2)}`, import.meta.url).href;
    const url = resolved.endsWith('.js') || resolved.endsWith('.vue') ? resolved : `${resolved}.js`;
    return nextResolve(url, context);
  }
  return nextResolve(specifier, context);
}
