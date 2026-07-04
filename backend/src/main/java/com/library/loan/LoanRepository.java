package com.library.loan;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.member.id = :memberId AND l.status = 'ACTIVE'")
    long countActiveLoansByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT l FROM Loan l WHERE l.member.id = :memberId AND l.status = 'ACTIVE'")
    List<Loan> findActiveLoansByMemberId(@Param("memberId") Long memberId);

    @Query("SELECT COUNT(l) FROM Loan l WHERE l.member.id = :memberId AND l.bookCopy.book.id = :bookId AND l.status = 'ACTIVE'")
    long countActiveLoansByMemberIdAndBookId(@Param("memberId") Long memberId, @Param("bookId") Long bookId);

    @Query("SELECT l FROM Loan l WHERE l.bookCopy.id = :copyId AND l.status = 'ACTIVE'")
    Optional<Loan> findActiveLoanByCopyId(@Param("copyId") Long copyId);

    Optional<Loan> findByIdempotencyKey(String idempotencyKey);
}
