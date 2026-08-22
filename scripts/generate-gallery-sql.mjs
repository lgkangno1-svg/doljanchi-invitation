const galleryJson = JSON.stringify([
  {
    url: "/manus-storage/chaewon-gallery-feet.jpg",
    kind: "image",
    mimeType: "image/jpeg",
    fileName: "chaewon-gallery-feet.jpg"
  },
  {
    url: "/manus-storage/chaewon-gallery-hands.jpg",
    kind: "image",
    mimeType: "image/jpeg",
    fileName: "chaewon-gallery-hands.jpg"
  }
]);

console.log(`UPDATE invitations SET galleryImageUrls = '${galleryJson.replace(/'/g, "''")}' WHERE slug = 'invite-peach-ribbon-x7k2p';`);
