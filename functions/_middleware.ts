export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);
  const host = url.hostname.toLowerCase();

  // Root redirect for invite.avocadoss.co.kr or default pages host
  if (url.pathname === "/") {
    if (host.startsWith("admin.")) {
      return Response.redirect(`${url.origin}/admin`, 302);
    }
    return Response.redirect(`${url.origin}/invite/invite-peach-ribbon-x7k2p`, 302);
  }

  // Admin routing
  if (host.startsWith("admin.") && !url.pathname.startsWith("/admin") && !url.pathname.startsWith("/api") && !url.pathname.startsWith("/assets")) {
    return Response.redirect(`${url.origin}/admin`, 302);
  }

  return next();
};
