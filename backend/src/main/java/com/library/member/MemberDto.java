package com.library.member;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MemberDto {
    private Long id;
    private String name;
    private String email;
    private MemberTier tier;
    private MemberStatus status;
    private Long version;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
