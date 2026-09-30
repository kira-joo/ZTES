import { IsMongoId, IsString, Matches } from "class-validator";

export class ObjectIdParamsDto {
  @IsMongoId({ message: "Not a valid id." })
  id!: string;
}

export class SlugParamsDto {
  @IsString()
  slug!: string;
}

export class OrderNumberParamsDto {
  @Matches(/^\d{6}-\d{4,}$/, { message: "Not a valid order number." })
  orderNumber!: string;
}
