export function permittedSourceImageUrl(allowExternalImages: boolean, imageUrl: string | null) {
  return allowExternalImages ? imageUrl : null;
}
