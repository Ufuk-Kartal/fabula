
export enum SentenceStatus {
  VOTING = 'OYLANIYOR',
  APPROVED = 'ONAYLANDI',
  REJECTED = 'REDDEDILDI',
}

export interface Author {
  yazar_id: string;
  kullanici_adi: string;
  toplam_kazanis: number;
  toplam_gonderilen_cumle: number;
}

export interface StoryBranch {
  dal_id: string;
  baslik: string;
  kaynak_cumle_id: string | null;
  etkinlik_id?: string | null;
}

export interface Sentence {
  cumle_id: string;
  dal_id: string;
  ebeveyn_cumle_id: string | null;
  yazar_id: string;
  metin: string;
  gonderme_zamani: Date;
  toplam_oy: number;
  durum: SentenceStatus;
  etkinlik_id?: string | null;
}

export interface Vote {
  oy_id: string;
  kullanici_id: string;
  cumle_id: string;
  oy_zamani: Date;
}

export interface Badge {
  rozet_id: string;
  kullanici_id: string;
  rozet_adi: string;
  kazanma_zamani: Date;
}

export interface StoryEvent {
  etkinlik_id: string;
  baslik: string;
  aciklama: string;
  aktif: boolean;
  baslangic_dal_id: string;
  rozet_adi: string;
}

export interface StoryData {
  authors: Author[];
  branches: StoryBranch[];
  sentences: Sentence[];
  votes: Vote[];
  badges: Badge[];
  events: StoryEvent[];
}