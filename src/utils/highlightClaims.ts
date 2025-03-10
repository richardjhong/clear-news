export const highlightFalseClaims = (
  falseClaims: Array<{ claim: string; correction: string }>
) => {
  falseClaims.forEach(({ claim, correction }) => {
    // Create a regular expression to find the claim in the document
    const regex = new RegExp(claim, 'gi'); // 'gi' for global and case-insensitive

    // Replace the claim with the corrected information
    document.body.innerHTML = document.body.innerHTML.replace(
      regex,
      `<span style="background-color: yellow;">${correction}</span>`
    );
  });
};
