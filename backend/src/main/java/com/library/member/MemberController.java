package com.library.member;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    @Autowired
    private MemberService memberService;

    @Autowired
    private MemberMapper memberMapper;

    @GetMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<List<MemberDto>> getAllMembers() {
        List<MemberDto> dtos = memberService.getAllMembers().stream()
                .map(memberMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberDto> getMember(@PathVariable Long id) {
        Member member = memberService.getMemberById(id);
        return ResponseEntity.ok(memberMapper.toDto(member));
    }

    @PostMapping
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<MemberDto> registerMember(@Valid @RequestBody RegisterMemberRequest request) {
        Member entity = memberMapper.toEntity(request);
        Member saved = memberService.registerMember(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(memberMapper.toDto(saved));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<MemberDto> updateStatus(
            @PathVariable Long id,
            @RequestParam MemberStatus status) {
        Member updated = memberService.updateMemberStatus(id, status);
        return ResponseEntity.ok(memberMapper.toDto(updated));
    }

    @PatchMapping("/{id}/tier")
    @PreAuthorize("hasRole('LIBRARIAN')")
    public ResponseEntity<MemberDto> updateTier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTierRequest request) {
        Member updated = memberService.updateMemberTier(id, request.getTier());
        return ResponseEntity.ok(memberMapper.toDto(updated));
    }
}
