#include <string>
#include <iostream>
#include <fstream>

int main(int narg, char *argv[]) {
  const int width = 50;
  int counter = 1;
  std::ifstream infile("MPL3115A2.dat");
  //std::ofstream outfile("slopes.dat");
  double t, temp, pres, alt;
  double told, tempold, presold, altold;
  double mtemp, mpres, malt;

  while(infile >> t >> temp >> pres >> alt) {
    if(counter == 1) {
      told = t;
      tempold = temp;
      presold = pres;
      altold = alt;
      counter++;
    } else if(counter == width) {
      counter = 1;
      mtemp = (temp - tempold)/(t - told);
      mpres = (pres - presold)/(t - told);
      malt = (alt - altold)/(t - told);
      std::cout << t << ", " << mtemp << ", " << mpres << ", " << malt << '\n';
    } else {
      counter++;
    }
  }

  return 0;
}
