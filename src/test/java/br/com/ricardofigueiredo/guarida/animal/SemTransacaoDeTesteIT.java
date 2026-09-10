package br.com.ricardofigueiredo.guarida.animal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Este teste nao leva @Transactional de proposito, e a ausencia e o ponto.
 *
 * Com a anotacao na classe, o Spring mantem uma sessao aberta durante o teste
 * inteiro, e associacao carregada sob demanda funciona mesmo quando nao
 * deveria. Em producao a aplicacao roda com open-in-view desligado: a
 * transacao fecha no fim do service e qualquer proxy que sobreviva estoura na
 * hora de montar a resposta.
 *
 * Foi exatamente o que aconteceu com o abrigo dentro do animal: a suite inteira
 * passava e a listagem devolvia 401 em producao, porque a excecao subia ate o
 * filtro de seguranca. Sem esta classe, o mesmo erro voltaria na proxima
 * associacao carregada sob demanda que alguem adicionar.
 *
 * Como nao ha reversao automatica, cada caso trabalha com um abrigo proprio.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SemTransacaoDeTesteIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /** Sem reversao automatica, o que este teste grava fica. Entao ele desfaz. */
    private final List<long[]> criados = new ArrayList<>();
    private final List<String> tokens = new ArrayList<>();

    @AfterEach
    void limparOQueFoiCriado() throws Exception {
        for (int indice = criados.size() - 1; indice >= 0; indice -= 1) {
            long id = criados.get(indice)[0];
            String token = tokens.get(indice);

            // adotado nao se exclui, entao a devolucao vem antes
            mockMvc.perform(post("/api/v1/animais/" + id + "/devolucao")
                    .header(HttpHeaders.AUTHORIZATION, token));
            mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                    .delete("/api/v1/animais/" + id)
                    .header(HttpHeaders.AUTHORIZATION, token));
        }
        criados.clear();
        tokens.clear();
    }

    @Test
    @DisplayName("a listagem do catalogo monta a resposta inteira fora da transacao")
    void catalogoForaDaTransacao() throws Exception {
        String token = autenticar();
        long id = criar(token, "Bidu");

        mockMvc.perform(get("/api/v1/animais").param("busca", "Bidu"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[0].abrigo.nome").isNotEmpty())
                .andExpect(jsonPath("$.itens[0].abrigo.cidade").isNotEmpty())
                .andExpect(jsonPath("$.itens[0].temperamentos").isArray());

        mockMvc.perform(get("/api/v1/animais/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.abrigo.nome").isNotEmpty())
                .andExpect(jsonPath("$.temperamentos[0].rotulo").value("Docil"));
    }

    @Test
    @DisplayName("a listagem do painel monta a resposta inteira fora da transacao")
    void painelForaDaTransacao() throws Exception {
        String token = autenticar();
        criar(token, "Amora");

        mockMvc.perform(get("/api/v1/painel/animais").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[0].abrigo.nome").isNotEmpty());
    }

    @Test
    @DisplayName("a fila de candidaturas monta a resposta inteira fora da transacao")
    void candidaturasForaDaTransacao() throws Exception {
        String token = autenticar();
        long id = criar(token, "Tobias");

        mockMvc.perform(post("/api/v1/animais/" + id + "/candidaturas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "Maria", "email": "maria@exemplo.com", "telefone": "21999998888",
                                 "cidade": "Niteroi", "moradia": "CASA", "areaProtegida": true,
                                 "temOutrosAnimais": false}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.animalNome").value("Tobias"));

        mockMvc.perform(get("/api/v1/candidaturas").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itens[0].animalNome").value("Tobias"));

        mockMvc.perform(get("/api/v1/animais/" + id + "/candidaturas")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].animalNome").value("Tobias"));
    }

    @Test
    @DisplayName("alterar e excluir tambem respondem sem sessao aberta")
    void alterarEExcluirForaDaTransacao() throws Exception {
        String token = autenticar();
        long id = criar(token, "Nina");

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/v1/animais/" + id)
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "Nina Feliz",
                                  "especie": "CACHORRO",
                                  "sexo": "FEMEA",
                                  "porte": "PEQUENO",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 6200,
                                  "temperamentos": ["CALMO"]
                                }""".formatted(LocalDate.now().minusMonths(8))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.abrigo.nome").isNotEmpty())
                .andExpect(jsonPath("$.nome").value("Nina Feliz"));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/v1/animais/" + id)
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNoContent());
    }

    private long criar(String token, String nome) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "nome": "%s",
                                  "especie": "CACHORRO",
                                  "sexo": "MACHO",
                                  "porte": "MEDIO",
                                  "nascimentoEstimado": "%s",
                                  "pesoEmGramas": 15000,
                                  "dataDeEntrada": "%s",
                                  "temperamentos": ["DOCIL"]
                                }""".formatted(nome, LocalDate.now().minusYears(2),
                                LocalDate.now().minusMonths(2))))
                .andExpect(status().isCreated())
                .andReturn();

        long id = ler(resultado).get("id").asLong();
        criados.add(new long[]{id});
        tokens.add(token);
        return id;
    }

    private String autenticar() throws Exception {
        String email = "sem-tx-" + UUID.randomUUID() + "@exemplo.com";

        mockMvc.perform(post("/api/v1/autenticacao/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nome": "Abrigo Sem Transacao", "email": "%s", "senha": "senhaforte123",
                         "cidade": "Niteroi"}""".formatted(email)));

        MvcResult login = mockMvc.perform(post("/api/v1/autenticacao/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "senha": "senhaforte123"}""".formatted(email))).andReturn();

        return "Bearer " + ler(login).get("token").asText();
    }

    private JsonNode ler(MvcResult resultado) throws Exception {
        return objectMapper.readTree(resultado.getResponse().getContentAsString());
    }
}
