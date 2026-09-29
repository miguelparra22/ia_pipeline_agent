package com.qvision.inventory.product;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findAllByOrderByNameAsc();

    boolean existsBySkuIgnoreCase(String sku);

    /**
     * Productos cuyo nombre o SKU contienen {@code pattern}, sin distinguir mayúsculas.
     * {@code pattern} ya debe venir con los comodines escapados usando {@code \}.
     */
    @Query("""
            select p from Product p
            where lower(p.name) like lower(concat('%', :pattern, '%')) escape '\\'
               or lower(p.sku)  like lower(concat('%', :pattern, '%')) escape '\\'
            order by p.name asc
            """)
    List<Product> searchByNameOrSku(@Param("pattern") String pattern);
}
