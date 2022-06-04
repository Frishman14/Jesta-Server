exports.kmToRadian = (kms) => {
    let earthRadiusInKm = 6378.1;
    return kms / earthRadiusInKm;
}