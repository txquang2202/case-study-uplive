import { Type } from "class-transformer";
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateNested,
} from "class-validator";

/**
 * DTO for a single video clip to be merged
 */
export class ClipDto {
  /**
   * Start time in seconds
   */
  @IsNumber()
  start!: number;

  /**
   * End time in seconds
   */
  @IsNumber()
  end!: number;
}

/**
 * DTO for merging video clips
 */
export class MergeClipsDto {
  /**
   * Array of clips to merge
   */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClipDto)
  clips!: ClipDto[];

  /**
   * Transition effect to apply between clips
   */
  @IsEnum(["cut", "fade", "slide"])
  @IsOptional()
  transition?: "cut" | "fade" | "slide";
}
