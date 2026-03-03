import tmdbLogoUrl from '../assets/tmdb_logo.svg';

export function TmdbLogo() {
  return (
    <img src={tmdbLogoUrl} alt="The Movie Database" className="h-7 w-auto" />
  );
}
