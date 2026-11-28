package com.minroamer.expense;

import com.minroamer.trip.Trip;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "expenses", indexes = @Index(
    name = "idx_expenses_trip_date", columnList = "trip_id, expense_date, id"
))
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trip_id", nullable = false)
    private Trip trip;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(name = "amount_cents", nullable = false)
    private int amountCents;

    @Column(nullable = false, length = 16)
    private String category;

    @Column(name = "expense_date", nullable = false)
    private LocalDate date;

    @Column(length = 500)
    private String note;

    protected Expense() {}

    Expense(Trip trip, String title, int amountCents, String category, LocalDate date, String note) {
        this.trip = trip;
        this.title = title;
        this.amountCents = amountCents;
        this.category = category;
        this.date = date;
        this.note = note;
    }

    ExpenseResponse toResponse() {
        return new ExpenseResponse(id, title, amountCents, category, date, note);
    }
}
