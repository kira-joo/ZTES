import { NewsletterDto } from "src/server/commerce/dto/commerce.dto";
import { NewsletterSubscriberModel } from "src/server/content/small-content.schema";
import { enforceRateLimit, RATE_LIMITS, resolveClientIp } from "src/server/core/rate-limit/rate-limit";
import { createPostRoute } from "src/server/core/route-factories";
import { Locale } from "src/common/enums";

export const dynamic = "force-dynamic";

/** Subscribing twice is a success, not an error — and says nothing about who is subscribed. */
export const POST = createPostRoute({
  auth: false,
  body: NewsletterDto,
  handler: async ({ body, request }) => {
    await enforceRateLimit({ key: `newsletter:${resolveClientIp(request)}`, ...RATE_LIMITS.NEWSLETTER });
    await NewsletterSubscriberModel.updateOne(
      { email: body.email.toLowerCase() },
      { $setOnInsert: { email: body.email.toLowerCase(), locale: body.locale ?? Locale.AR } },
      { upsert: true }
    );
    return { subscribed: true };
  },
});
