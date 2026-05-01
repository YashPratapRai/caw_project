import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  type ValidationArguments,
} from 'class-validator';

const controlCharacterPattern = /[\u0000-\u001F\u007F]/;
const disallowedSchemePattern = /^(javascript|data|file):/i;
const encodedSchemePattern = /^[a-z][a-z0-9+.-]*%3a/i;
const schemeRelativePattern = /^\/\//;
const encodedSlashHostPattern = /^https?:%2f%2f/i;
const backslashHostPattern = /^https?:\\\\/i;

@ValidatorConstraint({ name: 'safeRedirectUrl', async: false })
export class SafeRedirectUrlConstraint implements ValidatorConstraintInterface {
  validate(value: unknown) {
    if (typeof value !== 'string') {
      return false;
    }

    if (!value) {
      return false;
    }

    if (controlCharacterPattern.test(value)) {
      return false;
    }

    if (
      disallowedSchemePattern.test(value) ||
      encodedSchemePattern.test(value) ||
      schemeRelativePattern.test(value) ||
      encodedSlashHostPattern.test(value) ||
      backslashHostPattern.test(value)
    ) {
      return false;
    }

    let parsed: URL;
    try {
      parsed = new URL(value);
    } catch {
      return false;
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    if (!parsed.hostname) {
      return false;
    }

    if (parsed.username || parsed.password) {
      return false;
    }

    return true;
  }

  defaultMessage(_args?: ValidationArguments) {
    return 'long_url must be a safe http or https URL.';
  }
}

function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function trimStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return value;
  }

  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
    .filter((entry) => entry !== '');
}

export class CreateLinkDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @Validate(SafeRedirectUrlConstraint)
  long_url!: string;

  @IsOptional()
  created_by?: unknown;

  @IsOptional()
  @Transform(({ value }) => trimString(value))
  @IsISO8601()
  expires_at?: string;

  @IsOptional()
  @Transform(({ value }) => trimStringArray(value))
  @IsArray()
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 32, { each: true })
  @Type(() => String)
  tags?: string[];
}
