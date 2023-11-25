export function getParentUrl() {
  var url = null;
  if (parent !== window) {
    try {
      url = parent.location.href;
    } catch (e) {
      url = document.referrer;
    }
  }
  return url;
}
