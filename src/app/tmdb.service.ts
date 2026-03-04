import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type MediaType = 'movie' | 'tv';

export interface TmdbItem {
  id: number;
  media_type: MediaType;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

export interface TmdbDetails {
  id: number;
  backdrop_path: string | null;
  poster_path: string | null;
  overview: string;
  vote_average: number;
  genres?: Array<{ id: number; name: string }>;
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  release_date?: string;
  first_air_date?: string;
  title?: string;
  name?: string;
  videos?: {
    results: TmdbVideo[];
  };
}

export interface TmdbVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

interface TmdbSearchResponse {
  page: number;
  results: Array<TmdbItem & { media_type: MediaType | 'person' }>;
  total_pages: number;
  total_results: number;
}

@Injectable({
  providedIn: 'root',
})
export class TmdbService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.tmdbApiUrl;
  private readonly apiKey = environment.tmdbApiKey;

  searchMulti(query: string, page = 1): Observable<TmdbSearchResponse> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('query', query)
      .set('include_adult', 'false')
      .set('language', 'es-ES')
      .set('page', page);

    return this.http.get<TmdbSearchResponse>(`${this.apiUrl}/search/multi`, { params });
  }

  getDetails(id: number, mediaType: MediaType): Observable<TmdbDetails> {
    const params = new HttpParams()
      .set('api_key', this.apiKey)
      .set('language', 'es-ES')
      .set('append_to_response', 'videos');
    return this.http.get<TmdbDetails>(`${this.apiUrl}/${mediaType}/${id}`, { params });
  }
}
