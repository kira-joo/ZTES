import { IsString, MaxLength, MinLength } from "class-validator";

export class AdminLoginDto {
  @IsString() @MinLength(1, { message: "Enter the password." }) @MaxLength(200) password!: string;
}
