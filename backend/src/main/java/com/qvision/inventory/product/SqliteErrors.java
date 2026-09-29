package com.qvision.inventory.product;

import org.sqlite.SQLiteErrorCode;
import org.sqlite.SQLiteException;

/**
 * El dialecto SQLite de Hibernate no traduce las violaciones de restricciones: Spring las entrega
 * como {@code JpaSystemException} y no como {@code DataIntegrityViolationException}. Por eso se
 * revisa la causa original del driver.
 */
final class SqliteErrors {

    private SqliteErrors() {
    }

    static boolean isUniqueViolation(Throwable error) {
        for (Throwable cause = error; cause != null; cause = cause.getCause()) {
            if (cause instanceof SQLiteException sqlite
                    && sqlite.getResultCode() == SQLiteErrorCode.SQLITE_CONSTRAINT_UNIQUE) {
                return true;
            }
        }
        return false;
    }
}
