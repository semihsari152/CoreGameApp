export enum GuideBlockType {
  Text = 1,
  Image = 2,
  Video = 3,
  Code = 4,
  List = 5,
  Quote = 6,
  Divider = 7,
  Gallery = 8,
  Link = 9,
  Table = 10
}

export interface GuideBlock {
  id: number;
  guideId: number;
  blockType: GuideBlockType;
  order: number;
  content?: string;
  mediaUrl?: string;
  caption?: string;
  title?: string;
  metadata?: string;
  createdDate: string;
  updatedDate: string;
}

export interface CreateGuideBlock {
  id?: number; // ID mevcut bloklar için
  blockType: GuideBlockType;
  order: number;
  content?: string;
  mediaUrl?: string;
  caption?: string;
  title?: string;
  metadata?: string;
}

export interface GuideCategory {
  id: number;
  name: string;
  description?: string;
  iconClass?: string;
  order: number;
  createdDate: string;
}

export interface Guide {
  id: number;
  title: string;
  slug?: string;
  summary?: string;
  thumbnailUrl?: string;
  tableOfContents?: string;
  gameId: number | null;
  game?: {
    id: number;
    name: string;
  };
  userId: number;
  user?: {
    id: number;
    username: string;
    avatarUrl?: string;
    isActive?: boolean;
  };
  isPublished: boolean;
  isFeatured: boolean;
  difficulty: string;
  guideCategoryId?: number;
  guideCategory?: GuideCategory;
  tags: string[];
  averageRating: number;
  ratingCount: number;
  viewCount: number;
  likeCount?: number;
  dislikeCount?: number;
  commentCount?: number;
  createdDate: string;
  updatedDate: string;
  guideBlocks: GuideBlock[];
}

export interface CreateGuide {
  title: string;
  summary?: string;
  thumbnailUrl?: string;
  gameId: number | null;
  userId: number;
  isPublished?: boolean;
  difficulty: string;
  guideCategoryId?: number;
  tagIds: number[];
  guideBlocks: CreateGuideBlock[];
}

export interface BlockTypeDefinition {
  type: GuideBlockType;
  name: string;
  icon: string;
  description: string;
  category: 'basic' | 'media' | 'advanced';
}