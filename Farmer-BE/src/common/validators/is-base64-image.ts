import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5 MB

export function IsBase64Image(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBase64Image',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined || value === '') {
            return true; // optional field
          }
          if (typeof value !== 'string') {
            return false;
          }
          // Must be a data URL
          const dataUrlPattern = /^data:image\/(\w+);base64,/;
          const match = value.match(dataUrlPattern);
          if (!match) {
            return false;
          }
          // Extract base64 content and validate size
          const base64Data = value.split(',')[1];
          if (!base64Data) return false;
          // Base64 size ≈ 4/3 of binary size; check decoded length
          const binarySize = (base64Data.length * 3) / 4;
          return binarySize <= MAX_AVATAR_SIZE;
        },
        defaultMessage(args: ValidationArguments) {
          return `Ảnh đại diện phải có dung lượng nhỏ hơn 5MB`;
        },
      },
    });
  };
}
