import { normalizeSaudiMobile } from "src/server/engines/normalize";
import { setCartGift } from "src/server/commerce/cart.service";
import { SetGiftDto } from "src/server/commerce/dto/commerce.dto";
import { createPutRoute } from "src/server/core/route-factories";

export const dynamic = "force-dynamic";

/** Sets or clears ("gift": null) the "send as a gift" details carried into the order. */
export const PUT = createPutRoute({
  auth: false,
  body: SetGiftDto,
  handler: async ({ body }) =>
    setCartGift(
      body.gift
        ? {
            senderName: body.gift.senderName,
            recipientName: body.gift.recipientName,
            recipientPhone: normalizeSaudiMobile(body.gift.recipientPhone)!,
            message: body.gift.message ?? "",
            deliverOn: body.gift.deliverOn ? new Date(body.gift.deliverOn) : null,
          }
        : null
    ),
});
