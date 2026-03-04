import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounce, finalize, of, Subject, switchMap, timer } from 'rxjs';
import { environment } from '../environments/environment';
import { MediaType, TmdbDetails, TmdbItem, TmdbService, TmdbVideo } from './tmdb.service';

interface SearchRequest {
  query: string;
  page: number;
  debounce: boolean;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly appTitle = 'Buscador TMDB';
  protected readonly imageBaseUrl = environment.tmdbImageBaseUrl;
  protected readonly query = signal('');
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly results = signal<TmdbItem[]>([]);
  protected readonly currentPage = signal(1);
  protected readonly totalPages = signal(1);

  protected readonly selectedItem = signal<TmdbItem | null>(null);
  protected readonly selectedDetails = signal<TmdbDetails | null>(null);
  protected readonly detailsLoading = signal(false);
  protected readonly detailsError = signal('');
  protected readonly trailerUrl = signal<SafeResourceUrl | null>(null);
  protected readonly trailerName = signal('');

  private readonly tmdbService = inject(TmdbService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly searchRequests = new Subject<SearchRequest>();

  constructor() {
    this.searchRequests
      .pipe(
        debounce((request) => timer(request.debounce ? 300 : 0)),
        switchMap((request) => {
          const cleanQuery = request.query.trim();

          if (!cleanQuery) {
            this.loading.set(false);
            this.error.set('');
            this.results.set([]);
            this.currentPage.set(1);
            this.totalPages.set(1);
            return of(null);
          }

          this.loading.set(true);
          this.error.set('');

          return this.tmdbService.searchMulti(cleanQuery, request.page).pipe(
            catchError(() => {
              this.error.set('No se pudo consultar TMDB. Revisa tu API key y vuelve a intentar.');
              this.results.set([]);
              this.currentPage.set(1);
              this.totalPages.set(1);
              return of(null);
            }),
            finalize(() => this.loading.set(false))
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        const mediaItems = response.results.filter(
          (item): item is TmdbItem => item.media_type === 'movie' || item.media_type === 'tv'
        );

        this.results.set(mediaItems);
        this.currentPage.set(response.page);
        this.totalPages.set(response.total_pages || 1);
      });
  }

  protected search(): void {
    this.searchRequests.next({
      query: this.query(),
      page: 1,
      debounce: false
    });
  }

  protected onQueryChange(value: string): void {
    this.query.set(value);
    this.searchRequests.next({
      query: value,
      page: 1,
      debounce: true
    });
  }

  protected goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.searchRequests.next({
      query: this.query(),
      page,
      debounce: false
    });
  }

  protected getTitle(item: TmdbItem): string {
    return item.title || item.name || 'Sin titulo';
  }

  protected getDate(item: TmdbItem): string {
    return item.release_date || item.first_air_date || 'Fecha desconocida';
  }

  protected getPosterUrl(posterPath: string | null): string {
    return posterPath ? `${this.imageBaseUrl}${posterPath}` : 'https://via.placeholder.com/500x750?text=Sin+Imagen';
  }

  protected formatRating(value: number): string {
    return value ? value.toFixed(1) : 'N/A';
  }

  protected openDetails(item: TmdbItem): void {
    this.selectedItem.set(item);
    this.selectedDetails.set(null);
    this.detailsError.set('');
    this.detailsLoading.set(true);
    this.trailerUrl.set(null);
    this.trailerName.set('');

    this.tmdbService
      .getDetails(item.id, item.media_type)
      .pipe(finalize(() => this.detailsLoading.set(false)))
      .subscribe({
        next: (details) => {
          this.selectedDetails.set(details);
          const trailer = this.pickTrailer(details.videos?.results ?? []);

          if (trailer) {
            this.trailerUrl.set(
              this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${trailer.key}`)
            );
            this.trailerName.set(trailer.name);
          }
        },
        error: () => this.detailsError.set('No se pudieron cargar los detalles en este momento.')
      });
  }

  protected closeDetails(): void {
    this.selectedItem.set(null);
    this.selectedDetails.set(null);
    this.detailsError.set('');
    this.trailerUrl.set(null);
    this.trailerName.set('');
  }

  protected getMediaLabel(mediaType: MediaType): string {
    return mediaType === 'movie' ? 'Pelicula' : 'Serie';
  }

  protected getDurationInfo(details: TmdbDetails | null, mediaType: MediaType): string {
    if (!details) {
      return '-';
    }

    if (mediaType === 'movie') {
      return details.runtime ? `${details.runtime} min` : '-';
    }

    return details.number_of_seasons ? `${details.number_of_seasons} temporada(s)` : '-';
  }

  protected getGenres(details: TmdbDetails | null): string {
    if (!details?.genres?.length) {
      return '-';
    }
    return details.genres.map((genre) => genre.name).join(', ');
  }

  protected getBackdropUrl(path: string | null): string {
    return path ? `${this.imageBaseUrl}${path}` : 'https://via.placeholder.com/1200x675?text=Sin+Imagen';
  }

  private pickTrailer(videos: TmdbVideo[]): TmdbVideo | null {
    const youtubeVideos = videos.filter((video) => video.site === 'YouTube');
    if (!youtubeVideos.length) {
      return null;
    }

    return (
      youtubeVideos.find((video) => video.type === 'Trailer' && video.official) ||
      youtubeVideos.find((video) => video.type === 'Trailer') ||
      youtubeVideos.find((video) => video.type === 'Teaser') ||
      youtubeVideos[0]
    );
  }
}
