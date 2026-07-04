package com.library.member;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateTierRequest {
    @NotNull(message = "Member tier is required")
    private MemberTier tier;
}
