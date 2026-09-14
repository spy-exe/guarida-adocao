package br.com.ricardofigueiredo.guarida.foto;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface FotoRepository extends JpaRepository<FotoDoAnimal, Long> {

    /**
     * So as colunas leves, nunca os bytes. A listagem precisa saber se cada
     * animal tem foto e de quem e o credito, e para isso uma consulta basta,
     * seja a pagina de dez ou de cinquenta animais.
     */
    @Query("""
            select new br.com.ricardofigueiredo.guarida.foto.CreditoDaFoto(
                f.animalId, f.versao, f.autor, f.licenca, f.fonte)
            from FotoDoAnimal f
            where f.animalId in :ids
            """)
    List<CreditoDaFoto> creditosDe(@Param("ids") Collection<Long> ids);
}
