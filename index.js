import fetch from "node-fetch";
import config from "./config.js";
import { ConsoleLogColors } from "js-console-log-colors";
const out = new ConsoleLogColors();

(async () => {
  const sourceListJSON = await fetchWithRetries({
    url: config.monitor.sourceListJSON,
  })
    .then((res) => res.json())
    .then((json) => {
      return json;
    });

  out.success(`>> found ${sourceListJSON.chains.length} chains`);
  for (const chain of sourceListJSON.chains) {
    if (chain?.status != "live") {
      continue; // skip if not live
    }
    const restBaseURL = chain?.apis?.rest[0]?.address;
    if (!restBaseURL) {
      // if no rest endpoint provided, alert immediately .
    }
    const urlRestLatestBlock = `${restBaseURL}/cosmos/base/tendermint/v1beta1/blocks/latest`;
    const test = await fetchWithRetries({
      url: urlRestLatestBlock,
    })
      .then((res) => res.json())
      .then((json) => {
        out.success(`🟢 ${chain.chain_id} endpoint available`);
      })
      .catch((e) => {
        out.failure(`🔴 ${chain.chain_id} endpoint unavailable`);
      });
  }
})();

async function fetchWithRetries({
  url = null,
  attempts = 1,
  maxAttempts: maxRetries = config.retry.maxRetries,
  intervalSeconds = config.retry.intervalSeconds,
}) {
  if (!url) {
    return {};
  }

  return await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
    .then((res) => {
      return res;
    })
    .catch(async (e) => {
      if (error.code === "ENOTFOUND") {
        console.error("The requested URL was not found (DNS related).");
        // Handle the ENOTFOUND error here
      } else {
        out.warn(">>>>> error fetching url:");
        console.warn(error.message);
        // Handle other errors here
      }
      if (attempts <= maxRetries) {
        console.info(
          `retrying attempt ${attempts} of ${maxRetries} in ${intervalSeconds} seconds...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, intervalSeconds * 1000)
        );

        return await fetchWithRetries({
          url,
          attempts: attempts + 1,
          maxRetries: maxRetries,
          intervalSeconds,
        });
      } else {
        console.warn(">>>>>>>>>> All attempts failed...");
      }
    });
}
