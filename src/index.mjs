const fs = require("fs");
const path = require("path");
const xlsx = require("node-xlsx");
const { getPropMatrix, getRatingMatrix } = require("./read.mjs");
const K = 8;
const MAX_USER = 100;
const MAX_LOOP_COUNT = 1000;
/**
 *
 * @param {number[]} arr1
 * @param {number[]} arr2
 */
const isSameCenters = (centers, newCenters) => {
  if (centers.length !== newCenters.length) return false;
  let tempCenters = [];
  for (let i = 0; i < centers.length; i++) {
    tempCenters[i] = centers[i].toString();
  }
  let tempNewCenters = [];
  for (let i = 0; i < newCenters.length; i++) {
    tempNewCenters[i] = newCenters[i].toString();
  }
  for (let i = 0; i < tempCenters.length; i++) {
    if (!tempNewCenters.includes(tempCenters[i])) return false;
  }
  return true;
};
const getDistance = (a, b) => {
  try {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      let s = a[i] - b[i];
      sum += Math.sqrt(s * s);
    }
    return sum;
  } catch (error) {
    console.log(a, b);
    throw error;
  }
};
const getRMatrix = ({ ratingMatrix, propMatrix, len }) => {
  const R = [];
  for (let i = 0; i < MAX_USER; i++) {
    const ratingRow = ratingMatrix[i];
    if (!ratingRow) continue;
    const CR = [];
    for (let j = 0; j < propMatrix.length; j++) {
      const propRow = propMatrix[j];
      if (!propRow) continue;
      const CRRow = [];
      if (ratingRow[j]) {
        for (let k = 0; k < propRow.length; k++) {
          if (propRow[k]) {
            CRRow[k] = propRow[k] * ratingRow[j];
          }
        }
        CR.push(CRRow);
      }
    }
    const ICR = new Array(len).fill(0);
    for (let j = 0; j < len; j++) {
      for (let k = 0; k < CR.length; k++) {
        if (!CR[k]) continue;
        if (!CR[k][j]) continue;
        ICR[j] += CR[k][j];
      }
    }
    let sum = 0;
    for (let j = 0; j < ratingRow.length; j++) {
      if (ratingRow[j]) sum += ratingRow[j];
    }
    for (let j = 0; j < ICR.length; j++) {
      ICR[j] = ICR[j] / sum;
    }
    R[i] = ICR;
  }
  return R;
};
const kMeans = ({ R, len }) => {
  let centers = [];
  let groups = [];
  // ?????????????????????
  let k = 0;
  for (let i = 0; i < R.length; i++) {
    if (R[i]) {
      centers.push(R[i]);
      k++;
    }
    if (k === K) break;
  }
  let loopCount = 0;
  while (true) {
    loopCount++;
    // console.log(loopCount);
    // ?????????????????????????????????????????????????????????
    console.log("?????????????????????????????????????????????????????????");
    groups = [];
    for (let i = 0; i < R.length; i++) {
      // console.log(`????????????${i}??????`);
      const row = R[i];
      if (!row) continue;
      let minCenter = 0;
      let minCenterDis = Infinity;
      for (let j = 0; j < centers.length; j++) {
        const dis = getDistance(centers[j], row);
        if (dis < minCenterDis) {
          minCenter = j;
          minCenterDis = dis;
        }
      }
      if (!groups[minCenter]) {
        groups[minCenter] = [];
      }
      groups[minCenter].push(i);
    }

    // console.log(centers);
    // ????????????????????????
    console.log("????????????????????????");
    const newCenters = [];
    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      if (!group) continue;
      // console.log(`????????????${i}???????????????`);
      let newCenter = new Array(len).fill(0);
      for (let j = 0; j < len; j++) {
        for (let k = 0; k < group.length; k++) {
          newCenter[j] += R[group[k]][j];
        }
      }
      for (let j = 0; j < newCenter.length; j++) {
        newCenter[j] = newCenter[j] / group.length;
      }
      newCenters.push(newCenter);
    }

    // console.log(centers);
    // ????????????????????????
    if (isSameCenters(centers, newCenters)) {
      console.log("k-means????????????");
      return groups;
    } else {
      centers = newCenters;
    }
    if (loopCount > MAX_LOOP_COUNT) {
      console.log("??????????????????????????????");
      return groups;
    }
  }
};
const main = async () => {
  const ratingMatrix = await getRatingMatrix();
  const propMatrix = await getPropMatrix();
  const len = propMatrix[28].length;
  const R = getRMatrix({ ratingMatrix, propMatrix, len });
  const groups = kMeans({ R, len });
  R[0] = [
    "??????1",
    "??????2",
    "??????3",
    "??????4",
    "??????5",
    "??????6",
    "??????7",
    "??????8",
    "??????9",
    "??????10",
    "??????11",
    "??????12",
    "??????13",
    "??????14",
    "??????15",
    "??????16",
    "??????17",
    "??????18",
    "??????19",
  ];
  for (let i = 0; i < groups.length; i++) {
    groups[i] = [`??????${i + 1}`].concat(groups[i]);
  }
  fs.writeFileSync(
    path.resolve("src/k-means/R.xlsx"),
    xlsx.build([{ name: "??????????????????", data: R }])
  );
  fs.writeFileSync(
    path.resolve("src/k-means/groups.xlsx"),
    xlsx.build([{ name: "????????????", data: groups }])
  );
};
main();
