package com.qvision.inventory.product;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Errores de la API como {@link ProblemDetail} (RFC 9457). Los de validación y SKU duplicado
 * incluyen {@code errors}: un mensaje por campo (HU-002). Un producto inexistente responde
 * {@code 404} sin {@code errors} (HU-003).
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            // Si un campo incumple varias reglas, se muestra un solo mensaje.
            errors.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(problem(HttpStatus.BAD_REQUEST, "Datos inválidos", errors));
    }

    @Override
    protected ResponseEntity<Object> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex, HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return ResponseEntity.badRequest().body(problem(HttpStatus.BAD_REQUEST, "Solicitud mal formada", null));
    }

    @ExceptionHandler(DuplicateSkuException.class)
    ResponseEntity<ProblemDetail> handleDuplicateSku(DuplicateSkuException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(problem(HttpStatus.CONFLICT, "SKU duplicado", Map.of("sku", ex.getMessage())));
    }

    @ExceptionHandler(ProductNotFoundException.class)
    ResponseEntity<ProblemDetail> handleProductNotFound(ProductNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(problem(HttpStatus.NOT_FOUND, "Producto no encontrado", null));
    }

    private static ProblemDetail problem(HttpStatus status, String title, Map<String, String> errors) {
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setTitle(title);
        if (errors != null) {
            problem.setProperty("errors", errors);
        }
        return problem;
    }
}
