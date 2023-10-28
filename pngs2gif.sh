ffmpeg -r 30 -f image2 -i "./%04d.png" -filter_complex "[0:v] palettegen" "palette.png"
ffmpeg -r 30 -f image2 -i "./%04d.png" -i "./palette.png" -filter_complex "[0:v][1:v] paletteuse" "../out.gif"
