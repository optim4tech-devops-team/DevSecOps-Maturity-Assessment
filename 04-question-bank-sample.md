# Question Bank Sample

Bu dosya ilk MVP için kullanılabilecek örnek soru bankasını içerir.

## Organization

1. Kurumda kaç aktif uygulama bulunmaktadır?
   - Type: Numeric
   - Weight: Informational

2. Production ortamında çalışan kritik uygulama sayısı nedir?
   - Type: Numeric
   - Weight: Informational

3. DevOps süreçlerinden sorumlu ayrı bir ekip var mı?
   - Type: Single Choice
   - Options:
     - Yok = 0
     - Kısmen = 2
     - Var = 4
     - Platform Team olarak çalışıyor = 5

## SDLC

4. İş talepleri hangi araç üzerinden yönetiliyor?
   - Type: Tool Selector
   - Options: Jira, Azure Boards, ServiceNow, GitHub Issues, GitLab Issues, Excel, Email, Other

5. Definition of Ready tanımlı mı?
   - Type: Single Choice
   - Options: Yok=0, Kısmi=2, Tanımlı=3, Zorunlu=4, Otomatik kontrol ediliyor=5

6. Definition of Done tanımlı mı?
   - Type: Single Choice
   - Options: Yok=0, Kısmi=2, Tanımlı=3, Zorunlu=4, Otomatik kontrol ediliyor=5

## Source Control

7. Hangi source control aracı kullanılıyor?
   - Type: Tool Selector
   - Options: Azure DevOps Git, GitHub, GitLab, Bitbucket, TFVC, SVN, Other

8. Branch strategy tanımlı mı?
   - Type: Single Choice
   - Options: Yok=0, Kısmi=2, GitFlow=3, Trunk Based=4, Kurumsal standart ve denetimli=5

9. Pull Request zorunlu mu?
   - Type: Single Choice
   - Options: Hayır=0, Bazı projelerde=2, Tüm projelerde=4, Policy ile zorunlu=5

10. Minimum reviewer sayısı tanımlı mı?
    - Type: Single Choice
    - Options: Yok=0, 1 reviewer=3, 2 reviewer=4, Risk bazlı reviewer=5

11. CODEOWNERS kullanılıyor mu?
    - Type: Single Choice
    - Options: Hayır=0, Bazı projelerde=2, Tüm kritik projelerde=4, Otomatik enforcement=5

## CI

12. Pipeline as Code kullanılıyor mu?
    - Type: Single Choice
    - Options: Yok=0, Script bazlı=2, YAML bazlı=4, Template ve reusable library=5

13. Build sırasında unit test çalışıyor mu?
    - Type: Single Choice
    - Options: Hayır=0, Bazı projelerde=2, Tüm projelerde=4, Coverage gate ile=5

14. Artifact versioning standardı var mı?
    - Type: Single Choice
    - Options: Yok=0, Manuel=2, Otomatik=4, SemVer ve release tagging=5

## CD

15. Ortam bazlı deployment otomasyonu var mı?
    - Type: Multiple Choice
    - Options: DEV, TEST, UAT, PREPROD, PROD

16. Production deployment approval mekanizması var mı?
    - Type: Single Choice
    - Options: Yok=0, Manuel mail=1, ITSM/Jira onay=3, Pipeline gate=4, Policy based automated gate=5

17. Rollback stratejisi tanımlı mı?
    - Type: Single Choice
    - Options: Yok=0, Manuel=2, Dokümante=3, Otomatik=4, Test edilmiş otomatik rollback=5

## DevSecOps

18. SAST aracı kullanılıyor mu?
    - Type: Tool Selector
    - Options: SonarQube, Fortify, Checkmarx, Veracode, Semgrep, None

19. SAST PR aşamasında çalışıyor mu?
    - Type: Single Choice
    - Options: Hayır=0, Bazı projelerde=2, Tüm projelerde=4, Quality Gate ile zorunlu=5

20. DAST aracı kullanılıyor mu?
    - Type: Tool Selector
    - Options: OWASP ZAP, Burp Enterprise, Invicti, Acunetix, None

21. DAST release öncesi otomatik çalışıyor mu?
    - Type: Single Choice
    - Options: Hayır=0, Manuel=2, Scheduled=3, Pipeline integrated=4, Release gate ile zorunlu=5

22. SCA aracı kullanılıyor mu?
    - Type: Tool Selector
    - Options: Snyk, Mend, Nexus IQ, OWASP Dependency Check, GitHub Dependabot, None

23. Secret scanning var mı?
    - Type: Tool Selector
    - Options: GitLeaks, TruffleHog, GitGuardian, GitHub Secret Scanning, None

24. Container image scanning var mı?
    - Type: Tool Selector
    - Options: Trivy, Aqua, Prisma, Anchore, Clair, None

25. SBOM üretiliyor mu?
    - Type: Single Choice
    - Options: Hayır=0, Manuel=2, Bazı projelerde=3, Pipeline ile=4, Release artifact olarak zorunlu=5

## Observability

26. Monitoring araçları nelerdir?
    - Type: Tool Selector
    - Options: Prometheus, Grafana, Datadog, Dynatrace, New Relic, Zabbix, None

27. Log yönetimi merkezi mi?
    - Type: Tool Selector
    - Options: ELK, OpenSearch, Splunk, Loki, Azure Monitor, None

28. Distributed tracing kullanılıyor mu?
    - Type: Tool Selector
    - Options: Jaeger, Tempo, Zipkin, OpenTelemetry, None

29. SLI/SLO tanımlı mı?
    - Type: Single Choice
    - Options: Yok=0, Kısmi=2, Kritik servislerde=4, Error budget ile yönetiliyor=5

## Platform Engineering

30. Self-service repo/pipeline/environment oluşturma var mı?
    - Type: Single Choice
    - Options: Yok=0, Manuel talep=1, ITSM talebi=2, API otomasyonu=4, Developer portal self-service=5
