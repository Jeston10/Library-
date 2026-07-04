package com.library.member;

import com.library.exception.BusinessException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

class MemberNotFoundException extends BusinessException {
    public MemberNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND);
    }
}

class MemberEmailAlreadyExistsException extends BusinessException {
    public MemberEmailAlreadyExistsException(String message) {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

@Service
@Transactional
public class MemberService {

    @Autowired
    private MemberRepository memberRepository;

    @Transactional(readOnly = true)
    public List<Member> getAllMembers() {
        return memberRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Member getMemberById(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new MemberNotFoundException("Member not found with ID: " + id));
    }

    @Transactional(readOnly = true)
    public Member getMemberByEmail(String email) {
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new MemberNotFoundException("Member not found with email: " + email));
    }

    public Member registerMember(Member member) {
        Optional<Member> existing = memberRepository.findByEmail(member.getEmail());
        if (existing.isPresent()) {
            throw new MemberEmailAlreadyExistsException("Member with email " + member.getEmail() + " already exists.");
        }
        member.setStatus(MemberStatus.ACTIVE);
        return memberRepository.save(member);
    }

    public Member updateMemberStatus(Long id, MemberStatus status) {
        Member member = getMemberById(id);
        member.setStatus(status);
        return memberRepository.save(member);
    }

    public Member updateMemberTier(Long id, MemberTier tier) {
        Member member = getMemberById(id);
        if (member.getTier() == tier) {
            return member;
        }

        member.setTier(tier);
        Member updated = memberRepository.save(member);

        // Note: For downgrades, we log a warning as a judgement call (allowed under
        // assignment_Task.md spec).
        // The business rule "allow current loans to expire but block new checkouts"
        // will be handled
        // dynamically during checkout check (where we count active loans and compare to
        // member's CURRENT tier limit).
        if (tier == MemberTier.REGULAR) {
            System.err.println("WARNING: Downgrading member " + member.getEmail()
                    + " to REGULAR tier. Existing active loans might exceed new tier limit (3).");
        }

        return updated;
    }
}
