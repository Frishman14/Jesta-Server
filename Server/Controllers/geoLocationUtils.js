exports.kmToRadian = (kms) => {
    let earthRadiusInKm = 6371;
    return kms / earthRadiusInKm;
}