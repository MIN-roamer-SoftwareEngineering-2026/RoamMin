package com.minroamer.expense;

import com.minroamer.api.ApiResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/trips/{tripId}/expenses")
public class ExpenseController {
    private final ExpenseService expenses;

    public ExpenseController(ExpenseService expenses) {
        this.expenses = expenses;
    }

    @PostMapping
    public ApiResponse<ExpenseResponse> create(Authentication auth, @PathVariable Long tripId,
                                               @Valid @RequestBody ExpenseRequest request) {
        return ApiResponse.success(expenses.create((Long) auth.getPrincipal(), tripId, request));
    }

    @GetMapping
    public ApiResponse<List<ExpenseResponse>> list(Authentication auth, @PathVariable Long tripId) {
        return ApiResponse.success(expenses.list((Long) auth.getPrincipal(), tripId));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnreadableRequest() {
        return ResponseEntity.badRequest().body(ApiResponse.failure(400, "Invalid expense JSON or date"));
    }
}
