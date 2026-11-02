# Recuperação de folhas e ferramentas de escrita

Quando uma folha falha ao carregar, Tentar novamente repete o carregamento da mesma folha sem alterar rascunho, recorte, caneta, opacidade ou histórico. Se falhar novamente, a opção permanece disponível.

O teste scripts/verify-published.mjs agora verifica também desfazer/refazer, operação de borracha, escrita com cada uma das sete canetas, duas falhas de rede seguidas, recuperação da folha e arquivamento dos traços ao navegar. Usa um navegador isolado, sem alterar dados do usuário. O workflow existente executa esses cenários automaticamente.

Validação em 02/11/2026: 23 testes unitários passaram; TypeScript e build passaram; testes de navegador no desenvolvimento passaram. Nenhuma folha foi excluída ou filtrada; pressão física e conforto da escrita continuam fora desta validação automática.
