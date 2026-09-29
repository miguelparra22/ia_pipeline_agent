package com.qvision.inventory.product;

import java.util.List;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Consulta del inventario (HU-001), alta (HU-002) y actualización de productos (HU-003). */
@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    public List<ProductResponse> search(String query) {
        List<Product> products = (query == null || query.isBlank())
                ? repository.findAllByOrderByNameAsc()
                : repository.searchByNameOrSku(escapeLikeWildcards(query.trim()));
        return products.stream().map(ProductResponse::from).toList();
    }

    /**
     * Registra un producto ya validado. La comprobación previa da el error habitual de SKU
     * duplicado; el índice único de la base de datos cubre dos altas simultáneas.
     */
    @Transactional
    public ProductResponse create(CreateProductRequest request) {
        if (repository.existsBySkuIgnoreCase(request.sku())) {
            throw new DuplicateSkuException(request.sku(), null);
        }
        Product product = new Product(
                request.sku(), request.name(), request.quantity().intValueExact(), request.price());
        try {
            return ProductResponse.from(repository.saveAndFlush(product));
        } catch (DataAccessException e) {
            if (SqliteErrors.isUniqueViolation(e)) {
                throw new DuplicateSkuException(request.sku(), e);
            }
            throw e;
        }
    }

    /**
     * Actualiza nombre, cantidad y precio de un producto ya validado (HU-003). El SKU no cambia,
     * así que no puede haber conflicto con el índice único.
     */
    @Transactional
    public ProductResponse update(Long id, UpdateProductRequest request) {
        Product product = repository.findById(id).orElseThrow(() -> new ProductNotFoundException(id));
        product.update(request.name(), request.quantity().intValueExact(), request.price());
        return ProductResponse.from(repository.saveAndFlush(product));
    }

    /** Escapa {@code \}, {@code %} y {@code _} para que el texto del usuario se trate como literal. */
    static String escapeLikeWildcards(String text) {
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
