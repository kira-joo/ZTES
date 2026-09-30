import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/enums";
import { BrandModel } from "src/server/catalog/brand.schema";
import { CategoryModel } from "src/server/catalog/category.schema";
import { ProductModel } from "src/server/catalog/product.schema";
import { ReviewModel } from "src/server/catalog/review.schema";
import { CartModel } from "src/server/commerce/cart.schema";
import { CouponModel } from "src/server/commerce/coupon.schema";
import { CustomerModel } from "src/server/commerce/customer.schema";
import { OrderModel } from "src/server/commerce/order.schema";
import { HomeSectionModel } from "src/server/content/home-section.schema";
import { PageModel, PostModel } from "src/server/content/page.schema";
import { FaqModel, NewsletterSubscriberModel, TestimonialModel } from "src/server/content/small-content.schema";
import { StoreSettingsModel } from "src/server/content/store-settings.schema";

export const categoryRepository = createMongooseRepository({ model: CategoryModel, entityName: EntityName.CATEGORY });
export const brandRepository = createMongooseRepository({ model: BrandModel, entityName: EntityName.BRAND });
export const productRepository = createMongooseRepository({ model: ProductModel, entityName: EntityName.PRODUCT });
export const reviewRepository = createMongooseRepository({ model: ReviewModel, entityName: EntityName.REVIEW });
export const cartRepository = createMongooseRepository({ model: CartModel, entityName: EntityName.CART });
export const couponRepository = createMongooseRepository({ model: CouponModel, entityName: EntityName.COUPON });
export const customerRepository = createMongooseRepository({ model: CustomerModel, entityName: EntityName.CUSTOMER });
export const orderRepository = createMongooseRepository({ model: OrderModel, entityName: EntityName.ORDER });
export const homeSectionRepository = createMongooseRepository({
  model: HomeSectionModel,
  entityName: EntityName.HOME_SECTION,
});
export const pageRepository = createMongooseRepository({ model: PageModel, entityName: EntityName.PAGE });
export const postRepository = createMongooseRepository({ model: PostModel, entityName: EntityName.POST });
export const faqRepository = createMongooseRepository({ model: FaqModel, entityName: EntityName.FAQ });
export const testimonialRepository = createMongooseRepository({
  model: TestimonialModel,
  entityName: EntityName.TESTIMONIAL,
});
export const newsletterRepository = createMongooseRepository({
  model: NewsletterSubscriberModel,
  entityName: EntityName.NEWSLETTER_SUBSCRIBER,
});
export const storeSettingsRepository = createMongooseRepository({
  model: StoreSettingsModel,
  entityName: EntityName.STORE_SETTINGS,
});
