import { build } from "./app.js";
import { config, socialAuthConfigured } from "./config.js";

build()
  .then((app) =>
    app.listen({ port: config.port, host: "0.0.0.0" }).then(() => {
      console.log(`[gateway] listening on :${config.port} (mode=${config.woo.consumerKey ? "live" : "seed"})`);
      if (!socialAuthConfigured) {
        console.warn(
          "[gateway] GOOGLE_CLIENT_ID / FACEBOOK_APP_ID / FACEBOOK_APP_SECRET are not all set — social sign-in cannot verify token audience/app ownership and will reject (or, only outside production with SOCIAL_AUTH_ALLOW_UNVERIFIED=true, fall back to an unverified dev identity)."
        );
      }
      if (config.dataDir.startsWith("/tmp")) {
        console.warn(`[gateway] DATA_DIR=${config.dataDir} is ephemeral (S1 scalability scope: set DATA_DIR to a persistent disk or Redis-backed store before horizontal scaling; sessions/orders in /tmp are lost on deploy/restart).`);
      }
    })
  )
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
