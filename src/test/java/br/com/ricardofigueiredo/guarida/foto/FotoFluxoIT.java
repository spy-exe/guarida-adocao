package br.com.ricardofigueiredo.guarida.foto;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class FotoFluxoIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("o abrigo envia a foto e a ficha passa a apontar para ela com o credito")
    void enviaEFichaMostra() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Bidu");

        mockMvc.perform(enviar(id, imagem("jpg"), "foto.jpg")
                        .param("autor", "Maciek Godlewski")
                        .param("licenca", "CC BY 2.5")
                        .param("fonte", "https://commons.wikimedia.org/wiki/File:Kundel.jpg")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tipo").value("image/jpeg"))
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.startsWith("/api/v1/animais/" + id + "/foto?v=")));

        mockMvc.perform(get("/api/v1/animais/" + id))
                .andExpect(jsonPath("$.foto.autor").value("Maciek Godlewski"))
                .andExpect(jsonPath("$.foto.licenca").value("CC BY 2.5"))
                .andExpect(jsonPath("$.foto.url").isNotEmpty());

        mockMvc.perform(get("/api/v1/animais").param("busca", "Bidu"))
                .andExpect(jsonPath("$.itens[0].foto.autor").value("Maciek Godlewski"));
    }

    @Test
    @DisplayName("a foto e publica, com cache, ETag e resposta vazia quando o navegador ja tem")
    void baixaComCache() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Amora");
        byte[] png = imagem("png");

        mockMvc.perform(enviar(id, png, "amora.png").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());

        MvcResult baixada = mockMvc.perform(get("/api/v1/animais/" + id + "/foto"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(content().bytes(png))
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("max-age")))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andReturn();

        String etag = baixada.getResponse().getHeader("ETag");

        mockMvc.perform(get("/api/v1/animais/" + id + "/foto").header("If-None-Match", etag))
                .andExpect(status().isNotModified());

        mockMvc.perform(get("/api/v1/animais/" + id + "/foto").header("If-None-Match", "\"outra\""))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("trocar a foto troca a versao na URL")
    void trocaMudaVersao() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Tobias");

        String primeira = urlDaFoto(mockMvc.perform(enviar(id, imagem("png"), "a.png")
                .header(HttpHeaders.AUTHORIZATION, token)).andReturn());
        String segunda = urlDaFoto(mockMvc.perform(enviar(id, imagem("jpg"), "b.jpg")
                .header(HttpHeaders.AUTHORIZATION, token)).andReturn());

        org.assertj.core.api.Assertions.assertThat(segunda).isNotEqualTo(primeira);
    }

    @Test
    @DisplayName("arquivo que nao e imagem e recusado, mesmo chamado de .jpg")
    void recusaQuemNaoEImagem() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Nina");

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/v1/animais/" + id + "/foto")
                        .file(new MockMultipartFile("arquivo", "foto.jpg", "image/jpeg",
                                "<script>alert(1)</script>".getBytes()))
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("JPEG, PNG ou WEBP")));
    }

    @Test
    @DisplayName("foto acima de 2 MB e recusada com mensagem clara")
    void recusaFotoGrande() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Rex");
        byte[] grande = new byte[FotoService.TAMANHO_MAXIMO + 1];
        grande[0] = (byte) 0xFF;
        grande[1] = (byte) 0xD8;
        grande[2] = (byte) 0xFF;

        mockMvc.perform(enviar(id, grande, "grande.jpg").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("2 MB")));
    }

    @Test
    @DisplayName("link de origem que nao e http e recusado, para nao virar script na ficha publica")
    void recusaOrigemSemHttp() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Bento");

        mockMvc.perform(enviar(id, imagem("png"), "a.png").param("fonte", "javascript:alert(1)")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("http://")));

        mockMvc.perform(enviar(id, imagem("png"), "a.png").param("fonte", "  https://commons.wikimedia.org/wiki/File:A.jpg ")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("arquivo vazio e recusado")
    void recusaArquivoVazio() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Lola");

        mockMvc.perform(enviar(id, new byte[0], "vazio.jpg").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("sem o campo do arquivo a resposta diz qual campo faltou")
    void semArquivo() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Mel");

        mockMvc.perform(multipart(HttpMethod.PUT, "/api/v1/animais/" + id + "/foto")
                        .param("autor", "ninguem")
                        .header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("arquivo")));
    }

    @Test
    @DisplayName("sem token nao envia, e outro abrigo nao troca nem remove a foto")
    void isolamento() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Duque");
        mockMvc.perform(enviar(id, imagem("png"), "d.png").header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(enviar(id, imagem("png"), "d.png")).andExpect(status().isUnauthorized());

        String deOutro = autenticar();
        mockMvc.perform(enviar(id, imagem("png"), "d.png").header(HttpHeaders.AUTHORIZATION, deOutro))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/animais/" + id + "/foto").header(HttpHeaders.AUTHORIZATION, deOutro))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("remover a foto tira da ficha e o endereco passa a dar 404")
    void remove() throws Exception {
        String token = autenticar();
        long id = criarAnimal(token, "Zeca");
        mockMvc.perform(enviar(id, imagem("png"), "z.png").header(HttpHeaders.AUTHORIZATION, token));

        mockMvc.perform(delete("/api/v1/animais/" + id + "/foto").header(HttpHeaders.AUTHORIZATION, token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/animais/" + id + "/foto")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/animais/" + id)).andExpect(jsonPath("$.foto").doesNotExist());
    }

    @Test
    @DisplayName("a busca ignora acento nos dois sentidos")
    void buscaSemAcento() throws Exception {
        String token = autenticar();
        criarAnimal(token, "Pérola");

        mockMvc.perform(get("/api/v1/animais").param("busca", "perola"))
                .andExpect(jsonPath("$.totalDeItens").value(1));
        mockMvc.perform(get("/api/v1/animais").param("busca", "PÉROLA"))
                .andExpect(jsonPath("$.totalDeItens").value(1));
        mockMvc.perform(get("/api/v1/animais").param("cidade", "SAO GONCALO"))
                .andExpect(jsonPath("$.totalDeItens").value(1));
    }

    private MockMultipartHttpServletRequestBuilder enviar(long id, byte[] conteudo, String nome) {
        return (MockMultipartHttpServletRequestBuilder) multipart(HttpMethod.PUT, "/api/v1/animais/" + id + "/foto")
                .file(new MockMultipartFile("arquivo", nome, "application/octet-stream", conteudo));
    }

    private byte[] imagem(String formato) throws Exception {
        BufferedImage imagem = new BufferedImage(4, 3, BufferedImage.TYPE_INT_RGB);
        imagem.setRGB(1, 1, 0x38503a);
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        ImageIO.write(imagem, formato, saida);
        return saida.toByteArray();
    }

    private String urlDaFoto(MvcResult resultado) throws Exception {
        return ler(resultado).get("url").asText();
    }

    private long criarAnimal(String token, String nome) throws Exception {
        MvcResult resultado = mockMvc.perform(post("/api/v1/animais")
                        .header(HttpHeaders.AUTHORIZATION, token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome": "%s", "especie": "CACHORRO", "sexo": "MACHO", "porte": "MEDIO",
                                 "nascimentoEstimado": "%s", "pesoEmGramas": 15000, "dataDeEntrada": "%s"}"""
                                .formatted(nome, LocalDate.now().minusYears(2), LocalDate.now().minusMonths(2))))
                .andExpect(status().isCreated())
                .andReturn();
        return ler(resultado).get("id").asLong();
    }

    private String autenticar() throws Exception {
        String email = "foto-" + UUID.randomUUID() + "@exemplo.com";
        mockMvc.perform(post("/api/v1/autenticacao/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"nome": "Abrigo da Foto", "email": "%s", "senha": "senhaforte123",
                         "cidade": "São Gonçalo"}""".formatted(email)));
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
