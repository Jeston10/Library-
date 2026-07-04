package com.library.security;

import lombok.Data;

@Data
public class MockTokenRequest {
    private String email;
    private String role;
    private Long userId;
}
