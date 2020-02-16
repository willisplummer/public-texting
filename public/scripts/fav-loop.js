var favicon_images = [
  '/assets/favicon-0.png',
  '/assets/favicon-1.png',
  '/assets/favicon-2.png'
]
var image_counter = 0; // To keep track of the current image

console.log('here')

setInterval(
  () => {
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/png';
    link.rel = 'shortcut icon';
    link.href = favicon_images[image_counter];
    document.getElementsByTagName('head')[0].appendChild(link);
    // If last image then goto first image
    // Else go to next image    
    if(image_counter == favicon_images.length -1) {
      image_counter = 0;
    }
    else {
      image_counter++;
    }
  },
500);
