# Benchmark Gap Analysis

## Kapsam

Bu not, Enterprise Assessment Platform altındaki mevcut SDLC & DevSecOps Assessment modülünü DORA, OWASP SAMM ve GitLab Value Streams Dashboard yaklaşımıyla karşılaştırır.

## Referans Noktaları

- DORA Quick Check: Çok kısa soru setiyle yazılım teslimat performansını ölçer, sektörel karşılaştırma ve odaklanılacak capability önerileri üretir.
- DORA Core Model: Capability, metrik ve outcome ilişkisini sürekli iyileştirme rehberi olarak kullanır.
- OWASP SAMM: Yazılım güvenliği olgunluğunu governance, design, implementation, verification ve operations fonksiyonları altında ölçer.
- GitLab Value Streams Dashboard: DORA, flow, security ve trend metriklerini merkezi bir dashboard altında toplar; drill-down, trend ve ekip/proje karşılaştırması sunar.

## Mevcut Güçlü Yönler

- Token bazlı assessment akışı hazır.
- Skor, kategori kırılımı, öneri ve roadmap otomatik üretiliyor.
- Markdown, HTML, JSON ve offline PDF export mevcut.
- PDF üretimi dış AI servisine bağlı değil; aynı token lifecycle içinde hazırlanabiliyor.
- Kurumsal görüşme için soru bankası 30 soruluk daha kısa sete indirildi.

## Eksik Yönler

1. Benchmark karşılaştırması:
   - Sektör, şirket büyüklüğü veya ekip tipi bazlı karşılaştırma yok.
   - DORA benzeri performans sınıfı yok: low/medium/high/elite gibi.

2. Trend ve tarihçe:
   - Aynı müşterinin önceki assessment sonuçları saklanıp karşılaştırılmıyor.
   - İyileşme/gerileme trend grafikleri yok.

3. DORA metrikleri:
   - Deployment frequency, lead time, change failure rate ve MTTR ayrı metrik olarak sorulmuyor veya hesaplanmıyor.
   - Pipeline/veri entegrasyonu olmadığı için metrikler kanıta dayalı değil.

4. SAMM güvenlik modeli:
   - DevSecOps soruları pratik seviyede iyi, fakat OWASP SAMM fonksiyonlarıyla birebir map edilmiyor.
   - Governance, verification ve operations güvenlik olgunluğu ayrı güvenlik heatmap'i olarak sunulmuyor.

5. Rapor lifecycle:
   - PDF artık Processing/Ready durumuna bağlı, ancak gerçek background worker veya queue yok.
   - MVP'de sayfa yenilendiğinde zamanı gelen rapor hazır hale getiriliyor.

6. UI/UX:
   - Menüler artık ayrı ekranlara ayrıldı; ancak drill-down, filtre, sahiplik ve aksiyon durumu henüz yok.
   - Mobil görünüm temel olarak çalışıyor, fakat grafik yoğun ekranlarda daha fazla responsive iyileştirme gerekiyor.

## Önerilen Sonraki Iterasyon

1. DORA metrikleri için 4 soru ve skor bandı ekle.
2. SAMM mapping alanı ekle: governance, design, implementation, verification, operations.
3. Recommendation aksiyonlarına owner, due date ve status ekle.
4. Report job için gerçek queue/worker modeli tasarla.
5. PDF tasarımını Türkçe font gömülü, daha temiz executive rapor formatına yükselt.
6. Benchmark ekranı ekle: current score, target score, industry percentile placeholder.
