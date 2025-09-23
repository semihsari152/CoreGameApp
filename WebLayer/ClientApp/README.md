# CoreGameApp Frontend

CoreGameApp'in React tabanlı frontend uygulaması.

## Özellikler

- **Modern UI/UX**: Tailwind CSS ile responsive ve modern tasarım
- **Authentication**: JWT tabanlı kullanıcı kimlik doğrulama sistemi
- **Dark Mode**: Koyu/açık tema desteği
- **Real-time Updates**: React Query ile veri yönetimi
- **Form Validation**: React Hook Form ile form yönetimi
- **Notifications**: React Hot Toast ile bildirimler
- **TypeScript**: Tip güvenliği için TypeScript desteği

## Geliştirme

### Gereksinimler

- Node.js 16+
- npm veya yarn

### Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Geliştirme sunucusunu başlat
npm start

# Production build
npm run build

# Testleri çalıştır
npm test
```

### Ortam Değişkenleri

`.env` dosyasında aşağıdaki değişkenleri yapılandırın:

```
REACT_APP_API_URL=http://localhost:5000/api
GENERATE_SOURCEMAP=false
```

## Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── auth/           # Authentication bileşenleri
│   ├── common/         # Ortak bileşenler
│   ├── games/          # Oyun ilgili bileşenler
│   ├── forum/          # Forum bileşenleri
│   └── ...
├── pages/              # Sayfa bileşenleri
├── hooks/              # Custom React hooks
├── services/           # API servisleri
├── types/              # TypeScript tip tanımları
├── utils/              # Yardımcı fonksiyonlar
└── index.tsx          # Uygulama giriş noktası
```

## Teknolojiler

- **React 18**: UI kütüphanesi
- **TypeScript**: Tip güvenliği
- **Tailwind CSS**: CSS framework
- **React Router**: Yönlendirme
- **React Query**: Server state yönetimi
- **React Hook Form**: Form yönetimi
- **Axios**: HTTP istemcisi
- **React Hot Toast**: Bildirimler
- **Lucide React**: İkonlar
- **date-fns**: Tarih işlemleri

## API Entegrasyonu

Uygulama ASP.NET Core backend ile iletişim kurar:

- Base URL: `http://localhost:5000/api`
- Authentication: JWT Bearer token
- Automatic token refresh desteği

## Tema Sistemi

Uygulama 3 tema modunu destekler:

- **Light**: Açık tema
- **Dark**: Koyu tema  
- **System**: Sistem tercihini takip et

## Browser Desteği

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+