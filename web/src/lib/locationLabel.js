export function locationLabel(parentId, crumbs) {
  if (!parentId || crumbs.length === 0) return 'My Drive';
  return crumbs.map((crumb) => crumb.name).join(' / ');
}
